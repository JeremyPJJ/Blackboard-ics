import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Forum, ForumDocument } from './schemas/forum.schema';

@Injectable()
export class ForumsService {
  constructor(
    @InjectModel(Forum.name) private readonly forumModel: Model<ForumDocument>,
  ) {}

  async create(forumData: any): Promise<ForumDocument> {
    const forum = new this.forumModel(forumData);
    return forum.save();
  }

  async findAllByCourse(courseId: string): Promise<ForumDocument[]> {
    return this.forumModel.find({ courseId }).exec();
  }

  async findById(id: string): Promise<ForumDocument> {
    const forum = await this.forumModel.findById(id).exec();
    if (!forum) {
      throw new NotFoundException('Foro no encontrado');
    }
    return forum;
  }

  async addPost(forumId: string, postData: any): Promise<ForumDocument> {
    const forum = await this.findById(forumId);
    forum.posts.push(postData);
    return forum.save();
  }

  async addReply(
    forumId: string,
    postIndex: number,
    replyData: any,
  ): Promise<ForumDocument> {
    const forum = await this.findById(forumId);
    if (postIndex >= forum.posts.length) {
      throw new NotFoundException('Publicación no encontrada');
    }
    forum.posts[postIndex].replies.push(replyData);
    return forum.save();
  }

  async addReplyToReply(
    forumId: string,
    postIndex: number,
    replyIndex: number,
    replyData: any,
  ): Promise<ForumDocument> {
    const forum = await this.findById(forumId);
    if (postIndex >= forum.posts.length) {
      throw new NotFoundException('Publicación no encontrada');
    }
    const reply = forum.posts[postIndex].replies[replyIndex];
    if (!reply) {
      throw new NotFoundException('Respuesta no encontrada');
    }
    if (!reply.replies) reply.replies = [];
    reply.replies.push(replyData);
    return forum.save();
  }

  async updatePost(
    forumId: string,
    postIndex: number,
    content: string,
  ): Promise<ForumDocument> {
    const forum = await this.findById(forumId);
    if (postIndex >= forum.posts.length) {
      throw new NotFoundException('Publicación no encontrada');
    }
    forum.posts[postIndex].content = content;
    forum.posts[postIndex].editedAt = new Date();
    return forum.save();
  }

  async react(forumId: string, postIndex: number, userId: string): Promise<ForumDocument> {
    const forum = await this.findById(forumId);
    if (postIndex >= forum.posts.length) {
      throw new NotFoundException('Publicación no encontrada');
    }
    const reactions = forum.posts[postIndex].reactions as any[];
    const idx = reactions.findIndex((r: any) => r.toString() === userId);
    if (idx >= 0) {
      reactions.splice(idx, 1);
    } else {
      reactions.push(userId as any);
    }
    return forum.save();
  }

  async lockForum(forumId: string): Promise<ForumDocument> {
    return this.forumModel.findByIdAndUpdate(
      forumId,
      { isLocked: true },
      { new: true },
    ).exec();
  }

  async unlockForum(forumId: string): Promise<ForumDocument> {
    return this.forumModel.findByIdAndUpdate(
      forumId,
      { isLocked: false },
      { new: true },
    ).exec();
  }

  async update(forumId: string, updateData: any): Promise<ForumDocument> {
    const forum = await this.forumModel.findByIdAndUpdate(forumId, updateData, { new: true }).exec();
    if (!forum) {
      throw new NotFoundException('Foro no encontrado');
    }
    return forum;
  }

  async evaluateParticipant(
    forumId: string,
    userId: string,
    score: number,
    feedback?: string,
  ): Promise<ForumDocument> {
    const forum = await this.findById(forumId);
    const existing = forum.evaluations.find((e: any) => e.userId?.toString() === userId);
    if (existing) {
      existing.score = score;
      existing.feedback = feedback;
      existing.evaluatedAt = new Date();
    } else {
      forum.evaluations.push({ userId: userId as any, score, feedback, evaluatedAt: new Date() } as any);
    }
    return forum.save();
  }

  async getEvaluations(forumId: string): Promise<any[]> {
    const forum = await this.findById(forumId);
    return forum.evaluations || [];
  }

  async remove(forumId: string): Promise<void> {
    const result = await this.forumModel.deleteOne({ _id: forumId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Foro no encontrado');
    }
  }

  async removePost(forumId: string, postIndex: number): Promise<ForumDocument> {
    const forum = await this.findById(forumId);
    if (postIndex >= forum.posts.length) {
      throw new NotFoundException('Publicación no encontrada');
    }
    forum.posts.splice(postIndex, 1);
    return forum.save();
  }

  async removeReply(forumId: string, postIndex: number, replyIndex: number): Promise<ForumDocument> {
    const forum = await this.findById(forumId);
    if (postIndex >= forum.posts.length) {
      throw new NotFoundException('Publicación no encontrada');
    }
    const replies = forum.posts[postIndex].replies;
    if (replyIndex >= replies.length) {
      throw new NotFoundException('Respuesta no encontrada');
    }
    replies.splice(replyIndex, 1);
    return forum.save();
  }
}
