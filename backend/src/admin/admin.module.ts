import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AdminSeederService } from './admin-seeder.service';

@Module({
  imports: [
    // AdminSeederService needs the User repository to create the admin account
    TypeOrmModule.forFeature([User]),
  ],
  providers: [AdminSeederService],
  // Export so AppModule can see the seeder's OnModuleInit lifecycle hook
  exports: [AdminSeederService],
})
export class AdminModule {}
