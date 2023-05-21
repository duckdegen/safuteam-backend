import { IsEthereumAddress, IsString } from 'class-validator';
export class VerifyOrganizationMembershipInput {
  @IsString()
  organization: string;

  @IsString()
  @IsEthereumAddress()
  wallet: string;
}
