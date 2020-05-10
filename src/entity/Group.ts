import { Entity, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn, Generated, Index } from "typeorm";
import { Length } from "class-validator";

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated("uuid")
  @Index({ unique: true })
  uuid: string;

  @Column({
    length: 80,
  })
  @Length(1, 80)
  group: string;

  @Column()
  isActive: boolean;

  @CreateDateColumn()
  createdDateTime: Date;

  @UpdateDateColumn()
  updatedDateTime: Date;
}
