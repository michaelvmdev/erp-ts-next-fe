import { http, type Query } from './http';
import type {
  CreateNpsSurveyRequest,
  ListNpsSurveysQuery,
  NpsAnalytics,
  NpsAnalyticsQuery,
  NpsCampaignResult,
  NpsScore,
  NpsScoreQuery,
  NpsSurvey,
  Paginated,
} from './types';

export const npsApi = {
  score: (query: NpsScoreQuery = {}, signal?: AbortSignal) =>
    http.get<NpsScore>('/nps/score', query as Query, signal),

  analytics: (query: NpsAnalyticsQuery = {}, signal?: AbortSignal) =>
    http.get<NpsAnalytics>('/nps/analytics', query as Query, signal),

  list: (query: ListNpsSurveysQuery = {}, signal?: AbortSignal) =>
    http.get<Paginated<NpsSurvey>>('/nps', query as Query, signal),

  get: (surveyId: string, signal?: AbortSignal) =>
    http.get<NpsSurvey>(`/nps/${surveyId}`, undefined, signal),

  create: (body: CreateNpsSurveyRequest, signal?: AbortSignal) =>
    http.post<NpsSurvey>('/nps', body, signal),

  campaign: (body: { segment: 'promoter' | 'passive' | 'detractor'; subject: string }, signal?: AbortSignal) =>
    http.post<NpsCampaignResult>('/nps/campaign', body, signal),
};
