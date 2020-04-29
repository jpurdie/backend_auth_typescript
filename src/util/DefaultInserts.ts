import { Role } from "./../entity/Role";
import { getManager, Repository } from "typeorm";

export async function rolesInsert() {
  // default list.... add values here to be inserted on creation
  const list: string[] = ["owner", "admin", "user"];

  const rlRepository: Repository<Role> = getManager().getRepository(Role);

  for (const entry of list) {
    console.log('Check if Role "' + entry + '" exists...');
    const existingRL = await rlRepository.find({
      where: { name: entry },
    });
    if (existingRL.length > 0) {
      console.log("It exists. skipping...");
      continue;
    }
    console.log("Does not exist. Inserting...");

    const tempRole = new Role();
    tempRole.name = entry;
    tempRole.isActive = true;
    const rlSaved = await rlRepository.save(tempRole);
    console.log("Inserted", rlSaved);
    console.log(rlSaved);
  }
}
