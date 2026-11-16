import type { BookingAggregate, DateRange, InquiryAggregate } from './aggregates';

export interface BookingRepository {
  queryBookings(range: DateRange): Promise<BookingAggregate>;
}

export interface InquiryRepository {
  queryInquiries(range: DateRange): Promise<InquiryAggregate>;
}
