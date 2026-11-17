// Asserts hardening fields in deploy/k8s/*.yaml. Uses a minimal YAML-subset
// parser: block maps/lists, inline [a, b] and {}, scalars, multi-doc, comments.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function scalar(s) {
  s = s.trim();
  if (s === '{}') return {};
  if (s === '[]') return [];
  if (s.startsWith('[') && s.endsWith(']'))
    return s.slice(1, -1).split(',').map((x) => scalar(x)).filter((x) => x !== '');
  if (/^(true|false)$/.test(s)) return s === 'true';
  if (/^-?\d+$/.test(s)) return Number(s);
  if (/^(".*"|'.*')$/.test(s)) return s.slice(1, -1);
  return s;
}

function parseDoc(text) {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').replace(/^\s*#.*$/, '').replace(/\s+$/, ''))
    .filter((l) => l.trim() !== '')
    .map((l) => ({ indent: l.length - l.trimStart().length, text: l.trim() }));
  let i = 0;
  function block(indent) {
    if (lines[i].text.startsWith('- ')) {
      const arr = [];
      while (i < lines.length && lines[i].indent === indent && lines[i].text.startsWith('- ')) {
        const rest = lines[i].text.slice(2);
        lines[i] = { indent: indent + 2, text: rest };
        if (/^[^\s:][^:]*:(\s|$)/.test(rest)) arr.push(block(indent + 2));
        else { arr.push(scalar(rest)); i++; }
      }
      return arr;
    }
    const obj = {};
    while (i < lines.length && lines[i].indent === indent && !lines[i].text.startsWith('- ')) {
      const m = lines[i].text.match(/^([^:]+):\s*(.*)$/);
      i++;
      if (m[2] !== '') obj[m[1]] = scalar(m[2]);
      else if (i < lines.length && (lines[i].indent > indent ||
        (lines[i].indent === indent && lines[i].text.startsWith('- ')))) obj[m[1]] = block(lines[i].indent);
      else obj[m[1]] = null;
    }
    return obj;
  }
  return lines.length ? block(lines[0].indent) : null;
}

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'deploy', 'k8s');
const docs = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.yaml')))
  for (const part of readFileSync(join(dir, f), 'utf8').split(/^---\s*$/m)) {
    const d = parseDoc(part);
    if (d) docs.push({ f, d });
  }

let failed = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };
const find = (kind, name) => docs.find((x) => x.d.kind === kind && x.d.metadata?.name === name)?.d;

const dep = find('Deployment', 'dashboard-deployment');
check('deployment exists', !!dep);
const pod = dep?.spec?.template?.spec;
const c = pod?.containers?.[0];
const psc = pod?.securityContext, csc = c?.securityContext;
check('deployment runs non-root, read-only, no caps',
  psc?.runAsNonRoot === true && csc?.readOnlyRootFilesystem === true &&
  csc?.capabilities?.drop?.length === 1 && csc.capabilities.drop[0] === 'ALL' && !csc.capabilities.add);
check('pod uid/gid/fsGroup 1000', psc?.runAsUser === 1000 && psc?.runAsGroup === 1000 && psc?.fsGroup === 1000);
check('container runAsNonRoot', csc?.runAsNonRoot === true);
check('allowPrivilegeEscalation false', csc?.allowPrivilegeEscalation === false);
check('seccomp RuntimeDefault', psc?.seccompProfile?.type === 'RuntimeDefault');
check('automountServiceAccountToken false', pod?.automountServiceAccountToken === false);
check('image tag set', /^registry\.bavaro\.org:5000\/my-dashboard:[^:\s]+$/.test(c?.image ?? ''));
check('imagePullPolicy Always', c?.imagePullPolicy === 'Always');
check('containerPort 3000', c?.ports?.[0]?.containerPort === 3000);
check('/tmp emptyDir', !!c?.volumeMounts?.some((v) => v.mountPath === '/tmp') && !!pod?.volumes?.some((v) => v.emptyDir));
check('label app=dashboard', dep?.metadata?.labels?.app === 'dashboard');

const svc = find('Service', 'dashboard-service');
check('service 80 -> 3000', svc?.spec?.type === 'ClusterIP' && svc?.spec?.ports?.[0]?.port === 80 &&
  svc?.spec?.ports?.[0]?.targetPort === 3000 && svc?.spec?.selector?.app === 'dashboard');

const ing = docs.find((x) => x.d.kind === 'Ingress' && x.d.spec?.rules?.[0]?.host === 'www.bavaro.org')?.d;
const a = ing?.metadata?.annotations ?? {};
check('ingress host www.bavaro.org, traefik, backend 80',
  ing?.spec?.ingressClassName === 'traefik' &&
  ing.spec.rules[0].http.paths[0].backend.service.name === 'dashboard-service' &&
  ing.spec.rules[0].http.paths[0].backend.service.port.number === 80);
check('ingress annotations', a['cert-manager.io/cluster-issuer'] === 'letsencrypt-prod' &&
  a['traefik.ingress.kubernetes.io/router.entrypoints'] === 'websecure' &&
  a['traefik.ingress.kubernetes.io/router.middlewares'] === 'default-hsts@kubernetescrd');
check('ingress tls', ing?.spec?.tls?.[0]?.secretName === 'wildcard-bavaro-org-tls' &&
  ing.spec.tls[0].hosts.includes('www.bavaro.org') && ing.spec.tls[0].hosts.includes('bavaro.org'));

const apex = find('Ingress', 'dashboard-apex-redirect');
check('apex ingress', apex?.spec?.rules?.[0]?.host === 'bavaro.org' &&
  apex.spec.rules[0].http.paths[0].backend.service.name === 'dashboard-service' &&
  apex.metadata.annotations['traefik.ingress.kubernetes.io/router.middlewares'] === 'default-bavaro-apex-redirect@kubernetescrd');

const np1 = find('NetworkPolicy', 'dashboard-allow-traefik-ingress');
check('netpol traefik ingress 3000', np1?.spec?.podSelector?.matchLabels?.app === 'dashboard' &&
  np1.spec.ingress[0].from[0].namespaceSelector.matchLabels['kubernetes.io/metadata.name'] === 'traefik' &&
  np1.spec.ingress[0].ports[0].port === 3000);
const np2 = find('NetworkPolicy', 'dashboard-egress-dns-only');
check('netpol egress dns only', !!np2?.spec?.policyTypes?.includes('Egress') &&
  np2.spec.egress.length === 1 && np2.spec.egress[0].ports.every((p) => p.port === 53) &&
  np2.spec.egress[0].to[0].namespaceSelector.matchLabels['kubernetes.io/metadata.name'] === 'kube-system');
check('no duplicate default-deny policies', !docs.some((x) => /^default-deny/.test(x.d.metadata?.name ?? '')));

process.exit(failed ? 1 : 0);
