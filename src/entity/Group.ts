import { Entity, PrimaryGeneratedColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Length } from 'class-validator'


@Entity()
export class Group {
    @PrimaryGeneratedColumn()
    id: number
  
    @Column({
      length: 80
    })
    @Length(1, 80)
    group: string  

    @Column()
    isActive: boolean

    @CreateDateColumn()
    createdDateTime: Date

    @UpdateDateColumn()
    updatedDateTime: Date 
  
}
