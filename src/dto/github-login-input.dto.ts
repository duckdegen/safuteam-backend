import { IsEthereumAddress, IsString } from 'class-validator';
export class GithubLoginInput {
  @IsString()
  code: string;

  @IsString()
  @IsEthereumAddress()
  wallet: string;
}
