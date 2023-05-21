import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async checkGithubMembership(
    orgName: string,
    wallet: string,
    authToken: string,
    githubHandle: string,
  ): Promise<boolean> {
    const client = this.getClient(authToken);

    try {
      const memberList = await client.request(
        'GET /orgs/{organization}/members',
        {
          organization: orgName,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );

      console.log(`memberList: ${JSON.stringify(memberList)}`);

      const isMember = memberList.data.some(
        (member) => member.login === githubHandle,
      );

      if (isMember) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  private getClient(authToken: string): Octokit {
    return new Octokit({
      auth: authToken,
      throttle: {
        // eslint-disable-next-line
        onRateLimit: (retryAfter, options) => {
          // this.logger.warn(
          //   `Request quota exhausted for request ${options.method} ${options.url}`,
          // );
          return false;
        },
        // eslint-disable-next-line
        onSecondaryRateLimit: (retryAfter, options) => {
          // this.logger.warn(
          //   `SecondaryRateLimit detected for request ${options.method} ${options.url}`,
          // );
          return false;
        },
      },
    });
  }
}
