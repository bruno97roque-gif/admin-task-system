import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { RecordatorioService } from './recordatorio.service';
import { CreateRecordatorioDto } from './dto/create-recordatorio.dto';
import { UpdateRecordatorioDto } from './dto/update-recordatorio.dto';

@Controller('recordatorio')
export class RecordatorioController {
  constructor(private readonly recordatorioService: RecordatorioService) {}

  @Post()
  create(@Body() createRecordatorioDto: CreateRecordatorioDto) {
    return this.recordatorioService.create(createRecordatorioDto);
  }

  @Get()
  findAll() {
    return this.recordatorioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recordatorioService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecordatorioDto: UpdateRecordatorioDto,
  ) {
    return this.recordatorioService.update(id, updateRecordatorioDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recordatorioService.remove(id);
  }
}
