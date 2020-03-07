import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  Index
} from "typeorm";
import { OrganizationUser } from "./OrganizationUser";
import { Invitation } from "./Invitation";

@Entity()
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated("uuid")
  @Index({ unique: true })
  uuid: string;

  @Column({
    length: 80
  })
  name: string;

  @Column()
  isActive: boolean;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @OneToMany(
    type => OrganizationUser,
    organizationUser => organizationUser.user
  )
  organizationUser: OrganizationUser[];

  @OneToMany(
    type => Invitation,
    invitation => invitation.organization
  )
  invitations: Invitation[];
}
