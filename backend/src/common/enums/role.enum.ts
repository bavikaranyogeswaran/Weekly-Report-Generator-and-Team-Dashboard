// The three roles a user can have in the system
export enum Role {
  MEMBER  = 'MEMBER',  // can create and manage their own reports
  MANAGER = 'MANAGER', // can view all reports and access the dashboard
  ADMIN   = 'ADMIN',   // super-user: manages user roles, seeded from env vars
}
