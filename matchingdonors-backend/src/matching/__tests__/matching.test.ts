import { describe } from "node:test";
import { MatchingService } from "../matching.service";
import { Profile } from "../matching.types";

describe('MatchingService', () => {
    let service: MatchingService;

    beforeAll(() => {
        process.env.GEMINI_API_KEY = 'AIzaSyDPtU7i-ziRyqfLcVQiTr5cH90ijEshuiE';
        service = new MatchingService();
    });

    test('should compute cosine similarity correctly', () => {
        const vec1 = [1, 0, 0];
        const vec2 = [1, 0, 0];
        const similarity = service.computeSimilarity(vec1, vec2);
        expect(similarity).toBeCloeTo(1.0);
    });

    test('should generate embeddings', async () => {
        const text = 'Patient needs kidney transplant';
        const embedding = await service.generateEmbedding(text);
        expect(embedding).toBeInstanceOf(Array);
        expect(embedding.length).toBeGreaterThan(0);
    });
});