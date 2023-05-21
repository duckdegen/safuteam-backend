import {
  Controller,
  Get,
  Post,
  Body,
  Redirect,
  NotFoundException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { GithubLoginInput } from './dto/github-login-input.dto';
import { VerifyOrganizationMembershipInput } from './dto/verify-organization-membership-input.dto';
import { ResponseWithNoData } from './shared/entities/response.entity';
import axios from 'axios';
import { GithubAuthenticatedUserResponse } from './dto/github-authenticated-user.response';
import { UserService } from './user.service';
import { CreateWalletFromSignatureDto } from './dto/create-wallet-from-signature.dto';

@Controller()
export class AppController {
  private readonly ghConfig;

  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.ghConfig = {
      dev: {
        clientID: this.configService.get<string>('GITHUB_DEV_OAUTH_CLIENT_ID'),
        clientSecret: this.configService.get<string>(
          'GITHUB_DEV_OAUTH_CLIENT_SECRET',
        ),
        scope: ['read:user', 'read:org'],
      },
    };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('createUser')
  async createUser(@Body() user: CreateWalletFromSignatureDto): Promise<void> {
    console.log(`Creating user: ${JSON.stringify(user)}`);
    const existingUser = await this.userService.findOne(user.wallet);
    if (!existingUser) {
      await this.userService.create(user.wallet);
    }
  }

  @Get('trigger-dev-github-oauth')
  @Redirect('https://github.com/login/oauth/authorize', 301)
  triggerGithubDevOauth(): { url: string } {
    return {
      url: `https://github.com/login/oauth/authorize?scope=${this.ghConfig.dev.scope.join(
        ',',
      )}&client_id=${this.ghConfig.dev.clientID}`,
    };
  }

  @Post('check-github-membership')
  async checkGithubMembership(
    @Body() body: VerifyOrganizationMembershipInput,
  ): Promise<void> {
    const { organization, wallet } = body;

    const existingUser = await this.userService.findOne(wallet);

    const isMember = await this.appService.checkGithubMembership(
      organization,
      wallet,
      existingUser?.authToken,
      existingUser?.githubHandle,
    );

    if (isMember) {
      this.userService.update({
        userId: wallet,
        authToken: existingUser?.authToken,
        organization: organization,
        githubHandle: existingUser?.githubHandle,
      });
    } else {
      throw new NotFoundException({
        success: false,
        message: 'User is not a member of the organization',
      });
    }
  }

  @Get('delete-all-data')
  deleteAllData(): void {
    this.userService.deleteAll();
  }

  @Get('get-all-users')
  async getAllUsers(): Promise<unknown> {
    const allUsers = await this.userService.findAll();

    const sanitizedUsers = allUsers.map((user) => {
      const obj = {};
      obj['github:' + user.githubHandle] = user.organization;
      return obj;
    });

    return sanitizedUsers;
  }

  @Post('github-login')
  async githubLogin(
    @Body() body: GithubLoginInput,
  ): Promise<ResponseWithNoData> {
    const { wallet, code } = body;
    const userByWallet = await this.userService.findOne(wallet);

    if (!userByWallet) {
      throw new NotFoundException({
        success: false,
        message: 'User wallet not found',
      });
    }

    const { data: tokenParamsString } = await axios.get(
      `https://github.com/login/oauth/access_token?client_id=${this.ghConfig.dev.clientID}&client_secret=${this.ghConfig.dev.clientSecret}&code=${code}`,
    );
    // Note: tokenParamsString returns just a string like
    // access_token=gho_6YqtJpoiu34g9ij35EwegweOVIpETwegu34Vp6Iq&scope=read%3Aorg%2Cread%3Auser&token_type=bearer
    const params = new URLSearchParams(tokenParamsString);
    const accessToken = params.get('access_token');

    const data = await axios
      .get<GithubAuthenticatedUserResponse>('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .catch((err) => {
        console.error(
          `Github token request failed with error: ${err.response.data.message}`,
        );
      });

    if (!data) {
      return {
        success: false,
        message:
          'Github was unable to authenticate the user given the supplied challenge code',
      };
    }

    const profileData = data.data;

    const updatedUser = await this.userService.update({
      userId: wallet,
      authToken: accessToken,
      githubHandle: profileData.login,
    });

    console.log(`Updated user: ${JSON.stringify(updatedUser)}`);

    return {
      success: true,
      message: 'Github authenticated successfully',
    };
  }
}
