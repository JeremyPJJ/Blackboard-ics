import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExamsService } from './exams.service';

/**
 * Pruebas de la lógica de edición de puntaje de intento
 * (Spec: Exams — PATCH score de intento: edita el MEJOR intento, 400 fuera de
 * rango, 404 sin intento, status 'completed').
 * El servicio se prueba con un mock del `examModel` (mongoose).
 */
describe('ExamsService — setAttemptScore', () => {
  const examId = 'exam-1';
  const studentId = 'student-1';

  function buildAttempt(overrides: Record<string, unknown> = {}) {
    return {
      studentId,
      startedAt: new Date(),
      finishedAt: new Date(),
      answers: {},
      score: 10,
      maxScore: 20,
      status: 'completed',
      ...overrides,
    } as any;
  }

  function buildExam(overrides: Record<string, unknown> = {}) {
    const exam = {
      _id: examId,
      title: 'Examen de prueba',
      questions: [{ points: 10 }, { points: 10 }],
      attempts: [],
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
      ...overrides,
    };
    return exam as any;
  }

  function setup(exam: any) {
    const examModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(exam),
      }),
    } as any;
    const service = new ExamsService(examModel);
    return { service, examModel, exam };
  }

  it('lanza 404 si el examen no existe', async () => {
    const examModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    } as any;
    const service = new ExamsService(examModel);

    await expect(
      service.setAttemptScore(examId, studentId, 10),
    ).rejects.toThrow(NotFoundException);
  });

  it('lanza 404 si el estudiante no tiene intentos', async () => {
    const { service } = setup(buildExam());

    await expect(
      service.setAttemptScore(examId, studentId, 10),
    ).rejects.toThrow(NotFoundException);
  });

  it('lanza 404 si el estudiante tiene intentos pero ninguno con score', async () => {
    const { service } = setup(
      buildExam({
        attempts: [buildAttempt({ score: undefined, status: 'in_progress' })],
      }),
    );

    await expect(
      service.setAttemptScore(examId, studentId, 10),
    ).rejects.toThrow(NotFoundException);
  });

  it('edita el MEJOR intento (mayor score) y lo marca completed', async () => {
    const low = buildAttempt({ score: 5 });
    const high = buildAttempt({ score: 15 });
    const { service, exam } = setup(
      buildExam({ attempts: [low, high] }),
    );

    const result = await service.setAttemptScore(examId, studentId, 18);

    expect(high.score).toBe(18);
    expect(high.status).toBe('completed');
    expect(low.score).toBe(5);
    expect(exam.save).toHaveBeenCalled();
    expect(result).toBe(exam);
  });

  it('en empate de score edita el PRIMER intento del array', async () => {
    const first = buildAttempt({ score: 10 });
    const second = buildAttempt({ score: 10 });
    const { service, exam } = setup(
      buildExam({ attempts: [first, second] }),
    );

    await service.setAttemptScore(examId, studentId, 12);

    expect(first.score).toBe(12);
    expect(second.score).toBe(10);
    expect(exam.save).toHaveBeenCalled();
  });

  it('ignora intentos de otros estudiantes al elegir el mejor', async () => {
    const mine = buildAttempt({ score: 8 });
    const others = buildAttempt({ studentId: 'student-2', score: 19 });
    const { service } = setup(
      buildExam({ attempts: [mine, others] }),
    );

    const result = await service.setAttemptScore(examId, studentId, 9);

    expect(mine.score).toBe(9);
    expect(others.score).toBe(19);
    expect(result).toBeDefined();
  });

  it('lanza 400 si score > maxScore del intento', async () => {
    const { service, exam } = setup(
      buildExam({ attempts: [buildAttempt({ maxScore: 20 })] }),
    );

    await expect(
      service.setAttemptScore(examId, studentId, 21),
    ).rejects.toThrow(BadRequestException);
    expect(exam.save).not.toHaveBeenCalled();
  });

  it('usa Σ questions.points como máximo si el intento no tiene maxScore', async () => {
    const { service } = setup(
      buildExam({
        questions: [{ points: 10 }, { points: 10 }],
        attempts: [buildAttempt({ maxScore: undefined })],
      }),
    );

    await expect(
      service.setAttemptScore(examId, studentId, 21),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.setAttemptScore(examId, studentId, 20),
    ).resolves.toBeDefined();
  });

  it('lanza 400 si score es negativo', async () => {
    const { service, exam } = setup(
      buildExam({ attempts: [buildAttempt()] }),
    );

    await expect(
      service.setAttemptScore(examId, studentId, -1),
    ).rejects.toThrow(BadRequestException);
    expect(exam.save).not.toHaveBeenCalled();
  });

  it('acepta un score en el límite superior (score === maxScore)', async () => {
    const { service, exam } = setup(
      buildExam({ attempts: [buildAttempt({ maxScore: 20 })] }),
    );

    const result = await service.setAttemptScore(examId, studentId, 20);

    expect(result).toBe(exam);
    expect(exam.attempts[0].score).toBe(20);
    expect(exam.attempts[0].status).toBe('completed');
  });
});