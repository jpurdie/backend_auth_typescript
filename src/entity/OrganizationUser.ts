import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Generated, Index } from "typeorm";
import { User } from "./User";
import { Role } from "./Role";
import { Organization } from "./Organization";

@Entity()
export class OrganizationUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Organization, (organization) => organization.organizationUsers, {
    cascade: true,
  })
  organization: Organization;

  @ManyToOne((type) => User, (user) => user.organizationUser, {
    cascade: true,
  })
  user: User;

  @Column()
  @Generated("uuid")
  @Index({ unique: true })
  uuid: string;

  @ManyToOne((type) => Role, (role) => role.organizationUsers)
  role: Role;
}
