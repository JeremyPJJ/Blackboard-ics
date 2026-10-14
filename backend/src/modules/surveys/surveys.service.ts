import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Survey, SurveyDocument } from './schemas/survey.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class SurveysService {
  constructor(
    @InjectModel(Survey.name) private readonly surveyModel: Model<SurveyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(surveyData: any): Promise<SurveyDocument> {
    const survey = new this.surveyModel(surveyData);
    return survey.save();
  }

  async findAll(filters?: { courseId?: string; isActive?: boolean; targetRole?: string; creatorId?: string }): Promise<SurveyDocument[]> {
    const query: any = {};
    if (filters?.courseId) query.courseId = filters.courseId;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;
    if (filters?.targetRole) query.targetRole = filters.targetRole;
    if (filters?.creatorId) query.createdBy = filters.creatorId;
    return this.surveyModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<SurveyDocument> {
    const survey = await this.surveyModel.findById(id).exec();
    if (!survey) {
      throw new NotFoundException('Encuesta no encontrada');
    }
    return survey;
  }

  async update(id: string, surveyData: any): Promise<SurveyDocument> {
    const survey = await this.surveyModel.findByIdAndUpdate(id, surveyData, { new: true }).exec();
    if (!survey) {
      throw new NotFoundException('Encuesta no encontrada');
    }
    return survey;
  }

  async remove(id: string): Promise<void> {
    const result = await this.surveyModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Encuesta no encontrada');
    }
  }

  async submitResponse(surveyId: string, response: any, user?: any): Promise<SurveyDocument> {
    const survey = await this.findById(surveyId);

    // Evitar respuestas duplicadas SIEMPRE que tengamos userId (incluso en anónimas,
    // el anonimato se preserva en la presentación, no en el control de duplicados)
    if (response.userId) {
      const existing = survey.responses.find(
        (r: any) => r.userId && r.userId.toString() === response.userId.toString()
      );
      if (existing) {
        throw new ConflictException('Ya respondiste esta encuesta');
      }
    }

    // Guardar identidad (nombre + DNI) SOLO si la encuesta NO es anónima
    if (!survey.isAnonymous && user) {
      response.userName = `${user.names || ''} ${user.lastNames || ''}`.trim() || undefined;
      response.userDni = user.dni || undefined;
    } else {
      response.userName = undefined;
      response.userDni = undefined;
    }

    survey.responses.push(response);
    return survey.save();
  }

  async getResponses(surveyId: string): Promise<any> {
    const survey = await this.findById(surveyId);

    // Enriquecer respuestas con nombre/DNI desde la colección de usuarios
    // (cubre respuestas guardadas antes de que se registrara userName)
    const userIds = [...new Set(
      survey.responses.map((r: any) => r.userId?.toString()).filter(Boolean)
    )];

    const users = await this.userModel.find({ _id: { $in: userIds } }).select('names lastNames dni').lean().exec();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    const responses = survey.responses.map((r: any) => {
      const user = r.userId ? userMap.get(r.userId.toString()) : null;
      return {
        ...r.toObject ? r.toObject() : r,
        userName: r.userName || (user ? `${user.names} ${user.lastNames}`.trim() : undefined),
        userDni: r.userDni || (user ? user.dni : undefined),
      };
    });

    return {
      _id: survey._id,
      title: survey.title,
      isAnonymous: survey.isAnonymous,
      questions: survey.questions,
      responses,
    };
  }

  async getStatistics(surveyId: string): Promise<any> {
    const survey = await this.findById(surveyId);

    // answers puede ser un objeto plano o un Map (depende de cómo lo guardó mongoose)
    const normalize = (a: any) => {
      if (!a) return {};
      if (typeof a.get === 'function') {
        const out: any = {};
        a.forEach((v: any, k: string) => { out[k] = v; });
        return out;
      }
      return a;
    };

    const stats = {
      totalResponses: survey.responses.length,
      questionStats: survey.questions.map((question, index) => {
        const answers = survey.responses.map((r) => normalize(r.answers)[index]);
        return {
          questionIndex: index,
          questionText: question.text,
          answerDistribution: answers.reduce((acc: any, answer) => {
            const key = Array.isArray(answer) ? answer.join(', ') : String(answer ?? '—');
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {}),
        };
      }),
    };

    return stats;
  }
}
