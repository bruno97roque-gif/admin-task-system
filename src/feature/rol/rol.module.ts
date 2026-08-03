import { Module } from '@nestjs/common';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';
import { LibModule } from 'src/lib/lib.module';

@Module({
  controllers: [RolController],
  providers: [RolService],
  imports: [LibModule],
})
export class RolModule {}
