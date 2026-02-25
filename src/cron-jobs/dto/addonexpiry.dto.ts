import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUrl,
} from 'class-validator';

export class AddonExpiryEmailDto {
  @IsString()
  userName: string;

  @IsEmail()
  userEmail: string;

  @IsNumber({}, { message: 'addonLimit must be a number' })
  addonLimit: number;

  @IsNumber({}, { message: 'newStorageLimit must be a number' })
  newStorageLimit: number;

  @IsNumber({}, { message: 'storageUsed must be a number' })
  storageUsed: number;

  @IsBoolean()
  graceApplied: boolean;

  @IsOptional()
  graceEnd?: Date;

  @IsUrl({}, { message: 'renewLink must be a valid URL' })
  renewLink: string;
}
