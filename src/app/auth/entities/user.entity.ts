import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Otp } from './otp.entity';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string;

  @Column({ default: false })
  twoFA: boolean;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 6,
    transformer: dateTransformer()
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    precision: 6,
    transformer: dateTransformer()
  })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Otp, (otp) => otp.user)
  otp: Otp[];
}