import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exam, ExamDocument, ExamStatus } from './schemas/exam.schema';
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(
    @InjectModel(Exam.name) private readonly examModel: Model<ExamDocument>,
  ) {}

  async create(createExamDto: CreateExamDto): Promise<ExamDocument> {
    const exam = new this.examModel(createExamDto);
    return exam.save();
  }

  async findAllByCourse(courseId: string): Promise<ExamDocument[]> {
    return this.examModel.find({ courseId }).exec();
  }

  async findById(id: string): Promise<ExamDocument> {
    const exam = await this.examModel.findById(id).exec();
    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }
    return exam;
  }

  async update(id: string, updateExamDto: Partial<CreateExamDto>): Promise<ExamDocument> {
    const exam = await this.examModel.findByIdAndUpdate(id, updateExamDto, { new: true }).exec();
    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }
    return exam;
  }

  async remove(id: string): Promise<void> {
    const result = await this.examModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Examen no encontrado');
    }
  }

  async startAttempt(examId: string, studentId: string): Promise<ExamDocument> {
    const exam = await this.findById(examId);
    const studentIdStr = String(studentId);

    // No crear intento duplicado si ya hay uno en progreso
    const existing = exam.attempts.find(
      a => a.studentId?.toString() === studentIdStr && a.status === 'in_progress',
    );
    if (existing) {
      return exam;
    }

    // Respetar intentos máximos
    const completed = exam.attempts.filter(
      a => a.studentId?.toString() === studentIdStr && a.status === 'completed',
    ).length;
    if (completed >= exam.maxAttempts) {
      throw new ConflictException('Alcanzaste el máximo de intentos para este examen');
    }

    exam.attempts.push({
      studentId: studentId as any,
      startedAt: new Date(),
      status: 'in_progress',
      answers: {},
      finishedAt: undefined,
      score: undefined,
      maxScore: undefined,
      supervisionEvents: [],
    } as any);

    return exam.save();
  }

  async submitAttempt(
    examId: string,
    studentId: string,
    answers: any,
  ): Promise<ExamDocument> {
    const exam = await this.findById(examId);
    const studentIdStr = String(studentId);
    const attempt = exam.attempts.find(
      a => a.studentId?.toString() === studentIdStr && a.status === 'in_progress',
    );

    if (!attempt) {
      throw new NotFoundException('Intento de examen no encontrado');
    }

    attempt.answers = answers;
    attempt.finishedAt = new Date();
    attempt.status = 'completed';

    // Calcular puntaje si es automático
    if (exam.questions.length > 0) {
      let score = 0;
      let maxScore = 0;

      exam.questions.forEach((question, index) => {
        maxScore += question.points;
        const studentAnswer = answers[index.toString()];
        if (studentAnswer === question.correctAnswer) {
          score += question.points;
        }
      });

      attempt.score = score;
      attempt.maxScore = maxScore;
    }

    return exam.save();
  }

  async addSupervisionEvent(
    examId: string,
    studentId: string,
    eventType: string,
    details?: string,
  ): Promise<ExamDocument> {
    const exam = await this.findById(examId);
    const studentIdStr = String(studentId);
    const attempt = exam.attempts.find(
      a => a.studentId?.toString() === studentIdStr && a.status === 'in_progress',
    );

    if (!attempt) {
      throw new NotFoundException('Intento de examen no encontrado');
    }

    attempt.supervisionEvents.push({
      timestamp: new Date(),
      type: eventType,
      details,
    });

    return exam.save();
  }

  async removeAttempt(examId: string, studentId: string): Promise<ExamDocument> {
    const exam = await this.findById(examId);
    const studentIdStr = String(studentId);
    const idx = exam.attempts.findIndex(
      a => a.studentId?.toString() === studentIdStr,
    );
    if (idx < 0) {
      throw new NotFoundException('Intento del estudiante no encontrado');
    }
    exam.attempts.splice(idx, 1);
    return exam.save();
  }

  /**
   * Edita el puntaje del MEJOR intento del estudiante (Spec: Exams — PATCH
   * /exams/:id/attempts/:studentId). El mejor intento es el de mayor score y,
   * en empate, el PRIMERO del array (mismo criterio que `examScore()` del
   * gradebook). Valida 0..maxScore (400) y lanza 404 si el estudiante no tiene
   * intentos calificados.
   */
  async setAttemptScore(
    examId: string,
    studentId: string,
    score: number,
  ): Promise<ExamDocument> {
    const exam = await this.findById(examId);
    const studentIdStr = String(studentId);

    const studentAttempts = exam.attempts.filter(
      a => a.studentId?.toString() === studentIdStr,
    );
    if (studentAttempts.length === 0) {
      throw new NotFoundException('Intento del estudiante no encontrado');
    }

    const scoredAttempts = studentAttempts.filter(
      a => a.score !== undefined && a.score !== null,
    );
    if (scoredAttempts.length === 0) {
      throw new NotFoundException('Intento del estudiante no encontrado');
    }

    // Mejor intento: max score; en empate se conserva el primero (orden del array)
    let best = scoredAttempts[0];
    for (const attempt of scoredAttempts) {
      if ((attempt.score || 0) > (best.score || 0)) {
        best = attempt;
      }
    }

    // Rango válido: 0..maxScore (maxScore del intento ?? Σ questions.points)
    const maxScore =
      best.maxScore ??
      exam.questions.reduce((acc, question) => acc + (question.points || 0), 0);
    if (score < 0 || score > maxScore) {
      throw new BadRequestException(
        `El puntaje debe estar entre 0 y ${maxScore}`,
      );
    }

    best.score = score;
    best.status = 'completed';

    return exam.save();
  }
}
