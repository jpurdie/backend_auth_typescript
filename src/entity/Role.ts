import { Entity, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn, Generated, Index } from 'typeorm'
import { Length } from 'class-validator'
import { OrganizationUser } from './OrganizationUser'

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number

  externalId: string

  @Column({
    length: 80,
  })
  @Length(1, 80)
  name: string

  @Column()
  isActive: boolean

  @CreateDateColumn()
  createdDateTime: Date

  @UpdateDateColumn()
  updatedDateTime: Date

  @OneToMany((type) => OrganizationUser, (organizationUser) => organizationUser.role)
  organizationUsers: OrganizationUser[]
}
