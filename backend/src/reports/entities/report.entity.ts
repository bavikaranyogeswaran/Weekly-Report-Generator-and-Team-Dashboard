import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { ReportStatus } from '../../common/enums/report-status.enum';

// One report per user per week — enforced at the DB level so concurrent requests can't race past app-level checks
@Entity('reports')
@Unique(['userId', 'weekStart'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Indexed — appears in WHERE / ORDER BY / GROUP BY across reports, dashboard, and AI queries
  @Index()
  @Column({ name: 'week_start', type: 'date' })
  weekStart: Date;

  @Column({ name: 'week_end', type: 'date' })
  weekEnd: Date;

  // Fixed report fields — all team members fill the same fields in the same order
  @Column({ name: 'tasks_completed', type: 'text' })
  tasksCompleted: string;

  @Column({ name: 'tasks_planned', type: 'text' })
  tasksPlanned: string;

  @Column({ type: 'text' })
  blockers: string;

  // Optional — not all teams track hours
  @Column({ name: 'hours_worked', type: 'int', nullable: true })
  hoursWorked: number | null;

  // Optional — free-text notes or links
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Indexed — filtered in every list query and counted in dashboard aggregations
  @Index()
  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.DRAFT })
  status: ReportStatus;

  // Set to the current timestamp when the member submits the report
  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  // Automatically managed by TypeORM
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // --- Relations ---

  // Each report belongs to exactly one user
  @ManyToOne(() => User, (user) => user.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Store the FK directly so we can filter by userId without a join
  @Column({ name: 'user_id' })
  userId: string;

  // A report can be linked to a project/category (optional)
  @ManyToOne(() => Project, (project) => project.reports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;

  @Column({ name: 'project_id', nullable: true })
  projectId: string | null;
}
