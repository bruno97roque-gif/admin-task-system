import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AsignarUsuariosDto } from './dto/asignar-usuarios.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  // Las rutas con segmento fijo deben declararse antes de @Get(':id'), o
  // Express interpreta 'programador' / 'diseno' como un id de proyecto.
  @Get('programador')
  findByProgramer(
    @Query('id', new ParseIntPipe({ optional: true }))
    idProgramador?: number,
  ) {
    return this.projectsService.findByProgramer(idProgramador);
  }

  @Get('diseno')
  findByDiseno() {
    return this.projectsService.findByDiseno();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Post(':id/usuarios')
  asignarUsuarios(
    @Param('id', ParseIntPipe) id: number,
    @Body() asignarUsuariosDto: AsignarUsuariosDto,
  ) {
    return this.projectsService.asignarUsuarios(
      id,
      asignarUsuariosDto.usuariosIds,
    );
  }

  @Delete(':id/usuarios/:usuarioId')
  quitarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.projectsService.quitarUsuario(id, usuarioId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }
}
