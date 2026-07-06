// Tracks where a report is in its lifecycle
export enum ReportStatus {
  DRAFT = 'DRAFT',         // saved but not yet submitted
  SUBMITTED = 'SUBMITTED', // officially submitted by the team member
  LATE = 'LATE',           // week ended but no submission was made
}
