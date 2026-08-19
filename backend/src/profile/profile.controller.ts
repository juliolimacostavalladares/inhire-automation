import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AllowJwt, RequireUser } from "../common/api-key.guard";
import type { AuthenticatedRequest } from "../common/auth-context";
import { ImportProfileDto, UpdateProfileDto } from "./dto/profile.dto";
import { ProfileService } from "./profile.service";

@Controller("me/profile")
@AllowJwt()
@RequireUser()
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.profile.get(this.userId(request));
  }

  @Post("import")
  @UseInterceptors(FileInterceptor("file", {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  }))
  import(
    @Req() request: AuthenticatedRequest,
    @Body() input: ImportProfileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profile.importPdf(this.userId(request), { linkedinProfileUrl: input.linkedinProfileUrl, file });
  }

  @Patch()
  update(@Req() request: AuthenticatedRequest, @Body() input: UpdateProfileDto) {
    return this.profile.update(this.userId(request), input);
  }

  private userId(request: AuthenticatedRequest) {
    if (request.auth?.type !== "jwt") throw new Error("Authenticated user missing");
    return request.auth.userId;
  }
}
