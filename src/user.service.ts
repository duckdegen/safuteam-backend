import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

interface UserUpdateDto {
  userId: string;
  authToken?: string;
  organization?: string;
  githubHandle?: string;
}

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(wallet: string): Promise<User> {
    console.log(`Creating user: wallet: ${wallet}`);
    const newUser = new this.userModel({ userId: wallet });
    return newUser.save();
  }

  async update(userDto: UserUpdateDto): Promise<User> {
    console.log(`Updating user: userDto: ${JSON.stringify(userDto)}`);

    return this.userModel.findOneAndUpdate(
      { userId: userDto.userId },
      userDto,
      { new: true },
    );
  }

  async findOne(userId: string): Promise<User> {
    return this.userModel.findOne({ userId });
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  deleteAll(): void {
    this.userModel.deleteMany({}).exec();
  }
}
