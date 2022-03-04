import Airtable from 'airtable'
import moment from 'moment'
import { Company } from 'types/company'
import { Job } from 'types/job'
import { JobServiceInterface } from 'types/services/job-service'
import { JOBS_SINCE_LAST_UPDATED } from 'utils/constants'
import { defaultSlugify, isEmail } from 'utils/helpers'

export class AirtableJobService implements JobServiceInterface {
  private client: Airtable
  private base: Airtable.Base

  constructor() {
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_API_BASE) {
      throw new Error('Airtable API Base or Key not set.')
    }

    this.client = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    this.base = this.client.base(process.env.AIRTABLE_API_BASE ?? '')
  }

  public async GetCompany(id: string): Promise<Company | undefined> {
    try {
      const records = await this.base('Companies')
        .select({
          filterByFormula: `SEARCH("${id}", {Slug})`,
        })
        .all()

      // TODO: Not used yet. Map fields correctly..
      return records
        .map((source) => {
          return {
            id: source.fields['Slug'],
            title: source.fields['Name'],
            description: source.fields['Name'],
            body: source.fields['Name'],
          } as Company
        })
        .find((i) => !!i)
    } catch (e) {
      console.log('GetCompany', 'Unable to fetch company', id)
      console.error(e)
    }
  }

  public async GetJobs(companyId?: string, maxItems?: number): Promise<Array<Job>> {
    try {
      const records = await this.base('Jobs')
        .select({
          filterByFormula: companyId
            ? `AND(
          ({Active}),
          ({Company Slug} = "${companyId}")
        )`
            : `AND(
          ({Active})
        )`,
        })
        .all()

      return records
        .map((source) => {
          const applicationUrl = (source.fields['External Url'] as string) ?? ''
          let job = {
            id: source.fields['Slug'],
            slug: defaultSlugify(source.fields['Title'] as string),
            title: source.fields['Title'],
            department: source.fields['Department'],
            description: source.fields['Description'],
            body: source.fields['Body'],
            location: source.fields['Location'],
            remote: source.fields['Remote'] ?? false,
            company: {
              id: (source.fields['Company Slug'] as string[])[0],
              title: (source.fields['Company Name'] as string[])[0],
              description: (source.fields['Company Description'] as string[])[0],
              body: (source.fields['Company Body'] as string[])[0],
              website: (source.fields['Company Website'] as string[])[0],
              twitter:
                (source.fields['Company Twitter'] as string[])?.length > 0
                  ? (source.fields['Company Twitter'] as string[])[0]
                  : '',
              github:
                (source.fields['Company Github'] as string[])?.length > 0
                  ? (source.fields['Company Github'] as string[])[0]
                  : '',
              logo:
                (source.fields['Company Logo'] as any[])?.length > 0
                  ? (source.fields['Company Logo'] as any[])[0].url
                  : '',
            },
            url: isEmail(applicationUrl)
              ? `mailto:${applicationUrl}?subject=Apply for ${source.fields['Title']} (useWeb3)`
              : applicationUrl,
            updated: new Date(source.fields['Updated'] as string).getTime(),
            featured: false,
          } as Job

          if (source.fields['Featured']) {
            job.featuredUntil = new Date(source.fields['Featured'] as string).getTime()
            job.featured = job.featuredUntil >= new Date().getTime()
          }
          if (source.fields['Min Salary']) {
            job.minSalary = source.fields['Min Salary'] as number
          }
          if (source.fields['Max Salary']) {
            job.maxSalary = source.fields['Max Salary'] as number
          }

          return job
        })
        .filter((job: Job) => moment(job.updated).isAfter(moment().subtract(JOBS_SINCE_LAST_UPDATED, 'd')))
        .sort((a: Job, b: Job) => b.updated - a.updated)
        .slice(0, maxItems ?? 100)
    } catch (e) {
      console.log('AirtableJobService', 'Unable to fetch jobs', companyId)
      console.error(e)
    }

    return []
  }
}
