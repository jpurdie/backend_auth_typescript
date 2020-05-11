import { Entity, Index, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn, Generated } from "typeorm";
import { OrganizationUser } from "./OrganizationUser";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated("uuid")
  @Index({ unique: true })
  uuid: string;

  @Index({ unique: true })
  @Column()
  externalId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  password: string;

  @OneToMany((type) => OrganizationUser, (organizationUser) => organizationUser.user)
  organizationUser: OrganizationUser[];
}
