import { Entity, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn, Generated, ManyToOne, Index } from "typeorm";
import { Organization } from "./Organization";

@Entity()
@Index(["email", "organization"], { unique: true })
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 36,
  })
  @Index()
  token: string;

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
