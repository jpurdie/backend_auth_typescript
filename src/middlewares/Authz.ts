import { Request, Response, NextFunction } from 'express'
import { getManager } from 'typeorm'
import { OrganizationUser } from './../entity/OrganizationUser'
const jwtDecode = require('jwt-decode')

module.exports = (requiredRoles: Array<string>): any => {
  if (!Array.isArray(requiredRoles)) {
    throw new Error('Parameter role must be an array of strings representing the roles for the endpoint(s)')
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    let foundRoles: number
    try {
      const orgID = req.query.org_id
      console.log('orgid', orgID)
      const token: string = req.headers['authorization']
      const decoded = jwtDecode(token)
      const userId = decoded.sub

      console.log('userId', userId)
      console.log('orgid', orgID)
      console.log('requiredRoles', requiredRoles)

      // prettier-ignore
      foundRoles = await getManager().createQueryBuilder()
      .select('role.name')
      .from(OrganizationUser, 'organizationUser')
      .leftJoin('organizationUser.organization', 'org')
      .leftJoin('organizationUser.user', 'user')
      .leftJoin('organizationUser.role', 'role')
      .where('org.uuid = :orgID', { orgID: orgID })
      .andWhere('user.externalId = :userId', { userId: userId })
      .andWhere('role.name IN (:...names)', { names: requiredRoles })
      .getCount()

      console.log('foundRoles', foundRoles)
    } catch (ex) {
      console.log('ex', ex)
      res.status(401).send()
    }
    if (foundRoles > 0) next()
    else res.status(401).send()
  }
}
