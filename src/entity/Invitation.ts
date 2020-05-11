import { Entity, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn, Generated, ManyToOne, Index } from "typeorm";
import { Organization } from "./Organization";

@Entity()
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated("uuid")
  @Index({ unique: true })
  uuid: string;

  @Column({
    length: 80,
  })
  email: string;

  @Column()
  isActive: boolean;

  @Column()
  expiration: Date;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @ManyToOne((type) => Organization, (organization) => organization.invitations)
  organization: Organization;
}
