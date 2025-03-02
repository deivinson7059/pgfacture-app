import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  import { getExpiry } from 'src/app/common/utils/dateTimeUtility';
import { getFechaLocal } from 'src/app/common/utils/fechaColombia';
  
  @Entity({ schema: 'pgfacture', name: 'pg_opts' })
  export class Otp {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    userId: string;
  
    @Column()
    code: string;
  
    @Column()
    useCase: 'LOGIN' | 'D2FA' | 'PHV';
  
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
  
    @Column({ type: 'timestamp' })
    expiresAt: Date;
  
    @BeforeInsert()
    setExpireDate() {
      this.expiresAt = getExpiry();
    }
  
    @BeforeInsert()
    setCurrentDate() {
      this.createdAt = getFechaLocal();
      this.updatedAt = getFechaLocal();
    }
  
    // Relations
    @ManyToOne(() => User, (user) => user.otp)
    user: User;
  }