import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Task, TaskStatus } from '../entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  private readonly TAREA_DUPLICADA = 'No se encontró la tarea';

  async getAllTasks() {
    const tasks = await this.taskRepository.find();
    if (tasks.length === 0)
      throw new NotFoundException('Actualmente no tienes tareas');
    else return tasks;
  }

  async getTaskById(id: string) {
    const task = await this.taskRepository.findBy({ id });

    if (task.length === 0) throw new NotFoundException(this.TAREA_DUPLICADA);
    else return task;
  }

  async createTask(title: string, description: string) {
    const newTask = await this.taskRepository.create({ title, description });
    const [taskExists] = await this.taskRepository.findBy({ title });

    if (taskExists) {
      throw new ConflictException(
        'Error, ya existe una tarea con el mismo titulo',
      );
    }

    await this.taskRepository.save(newTask);
    return newTask;
  }

  async updateTask(
    id: string,
    title: string,
    description: string,
    completed: TaskStatus,
  ) {
    const [task] = await this.getTaskById(id);

    let modifiedTask: Task;

    if (task) {
      modifiedTask = {
        id,
        title,
        description,
        completed,
      };

      this.taskRepository.update(id, modifiedTask);
    }

    return modifiedTask;
  }

  async deleteTask(id: string) {
    try {
      if (await this.getTaskById(id)) {
        await this.taskRepository.delete(id);
        return {
          message: 'Tarea eliminada correctamente',
          statusCode: 200,
        };
      }
    } catch (err) {
      throw new NotFoundException(this.TAREA_DUPLICADA);
    }
  }
}
