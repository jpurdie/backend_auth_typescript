import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  Index
} from 'typeorm'
import { Length } from 'class-validator'

@Entity({ name: 'Roles' })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  @Index({ unique: true })
  uuid: string;

  @Index({ unique: true })
  @Column({
    length: 80
  })
  @Length(1, 80)
  name: string;

  @Column()
  isActive: boolean;

  @CreateDateColumn()
  createdDateTime: Date;

  @UpdateDateColumn()
  updatedDateTime: Date;
}
