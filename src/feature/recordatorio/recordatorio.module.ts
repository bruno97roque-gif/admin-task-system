import { Module } from '@nestjs/common';
import { RecordatorioService } from './recordatorio.service';
import { RecordatorioController } from './recordatorio.controller';

@Module({
  controllers: [RecordatorioController],
  providers: [RecordatorioService],
})
export class RecordatorioModule {}
