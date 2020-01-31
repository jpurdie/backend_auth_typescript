import { Entity, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

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

}
