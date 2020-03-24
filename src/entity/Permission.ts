import { Entity, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn, Generated, Index } from "typeorm";
import { Length } from "class-validator";

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated("uuid")
  @Index({ unique: true })
  uuid: string;

  // @Index({ unique: true })
  // @Column()
  // externalId: string;

  @Column({
    length: 80
  })
  @Length(1, 80)
  name: string;

  @Column({
    length: 100
  })
  @Length(1, 100)
  description: string;

  @Column()
  isActive: boolean;

  @CreateDateColumn()
  createdDateTime: Date;

  @UpdateDateColumn()
  updatedDateTime: Date;
}
