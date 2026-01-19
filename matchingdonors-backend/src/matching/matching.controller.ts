import { Request, Response } from "express";
import { MatchingService } from "./matching.service";
import { Profile, MatchRequest } from "./matching.types";

const matchingService = new MatchingService();

export class MatchingController {
    // Post /api/matching/store. Store a profile with embedding

    async storeProfile(req: Request, res: Response): Promise<void> {
        try {
            const profile: Profile = req.body;

            if (!profile.id || !profile.name || !profile.type || !profile.description) {
                res.status(400).json({
                    error: 'Missing required fields: id, name, type, description'
                });
                return;
            }

            await matchingService.storeProfile(profile);

            res.json({
                success: true,
                message: 'Profile stored successfully',
                profileId: profile.id
            });
        } catch (error) {
            console.error('Error storing profile:', error);
            res.status(500).json({
                error: 'Failed to store profile',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Post /api/matching/find; Find matching profiles
    async findMatches(req: Request, res: Response): Promise<void> {
        try {
            const matchRequest: MatchRequest = req.body;

            if (!matchRequest.profileId && !matchRequest.profileText) {
                res.status(400).json({
                    error: 'Either profiled or profileText must be provided'
                });
                return;
            }

            const matches = await matchingService.findTopMatches(matchRequest);

            res.json({
                success: true,
                matches,
                count: matches.length
            });
        } catch (error) {
            console.error('Error finding matches:', error);
            res.status(500).json({
                error: 'Failed to find matches',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Get /api/matching/profiles; Get all stored profiles for testing
    async getAllProfiles(req: Request, res: Response): Promise<void> {
        try {
            const profiles = matchingService.getAllProfiles();
            res.json({
                success: true,
                profiles,
                count: profiles.length
            });
        } catch (error) {
            console.error('Error getting profiles:', error),
                res.status(500).json({
                    error: 'Failed to get profiles',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
        }
    }
}