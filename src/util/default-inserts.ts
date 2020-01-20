import { Group } from './../entity/Group'
import { getManager, Repository } from 'typeorm'

export async function groupInsert() { 
  // default list.... add values here to be inserted on creation
  const list: string[] = ['owner', 'admin']
  
  const rlRepository: Repository<Group> = getManager().getRepository(Group)
  
  for (const entry of list) {
    
    console.log('Check if Group "' + entry + '" exists...')
    const existingRL = await rlRepository.find({ 
      where: { group: entry }
    })
    if (existingRL.length > 0 ) {
      console.log('It exists. skipping...')
      continue
    }
    console.log('Does not exist. Inserting...')

    const tempGroup = new Group()
    tempGroup.group = entry
    tempGroup.isActive = true
    const rlSaved = await rlRepository.save(tempGroup)
    console.log('Inserted', rlSaved)
    console.log(rlSaved)
    
  }   
}