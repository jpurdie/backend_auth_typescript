import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, PrimaryColumn, Unique, OneToMany } from 'typeorm'
import { User } from './User'
import { Organization } from './Organization'

@Entity()
export class OrganizationUser {
    @PrimaryGeneratedColumn()
    id: number
  
    @ManyToOne(type => Organization, organization => organization.organizationUser, {
        cascade: true,
    })
    organization: Organization
  
    @ManyToOne(type => User, user => user.organizationUser, {
        cascade: true,
    })
    user: User
}
