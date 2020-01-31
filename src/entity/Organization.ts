import { Entity, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { OrganizationUser } from './OrganizationUser'

@Entity()
export class Organization {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
      length: 80
    })
    name: string
  
    @Column()
    isActive: boolean

    @CreateDateColumn()
    createdDate: Date

    @UpdateDateColumn()
    updatedDate: Date   
  
    @OneToMany(type => OrganizationUser, organizationUser => organizationUser.user)
    organizationUser: OrganizationUser[]

}
