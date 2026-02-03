import { Request, Response } from "express";
import { MatchingService } from "./matching.service";
import { Profile, MatchRequest } from "./matching.types";
import { parse } from "node:path";

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
            const useRealData = req.query.useRealData === 'true';

            if (!matchRequest.profileId && !matchRequest.profileText) {
                res.status(400).json({
                    error: 'Either profiled or profileText must be provided'
                });
                return;
            }

            // If using real data, load profiles from database first
            if (useRealData && matchRequest.searcherType) {
                // Determine target type (opposite of searcher)
                const targetType = matchRequest.searcherType === 'patient' ? 'donor' : 'patient';

                // Extract user ID from profileId if available (format: user-{type}-{userId}-{timestamp})
                let excludeUserId: number | undefined;
                if (matchRequest.profileId) {
                    const parts = matchRequest.profileId.split('-');
                    if (parts.length >= 3 && parts[2]) {
                        const userId = parseInt(parts[2]);
                        if (!isNaN(userId)) {
                            excludeUserId = userId;
                        }
                    }
                }

                // Clear old data and load fresh profiles from database
                matchingService.clearAll();
                await matchingService.loadRealUserProfiles(targetType, excludeUserId);
            }

            const matches = await matchingService.findTopMatches(matchRequest);

            res.json({
                success: true,
                matches,
                count: matches.length,
                mode: useRealData ? 'real' : 'demo'
            });
        } catch (error) {
            console.error('Error finding matches:', error);
            res.status(500).json({
                error: 'Failed to find matches',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Get /api/matching/real-profiles - Load real user profiles from database
    async getRealProfiles(req: Request, res: Response): Promise<void> {
        try {
            const userType = req.query.type as 'patient' | 'donor' | undefined;
            const excludeUserId = req.query.excludeUserId ? parseInt(req.query.excludeUserId as string) : undefined;

            if (!userType) {
                res.status(400).json({
                    error: 'type parameter required (patient or donor)'
                });
                return;
            }

            // Load profiles from database
            const profiles = await matchingService.loadRealUserProfiles(userType, excludeUserId);

            res.json({
                success: true,
                profiles,
                count: profiles.length,
                source: 'database'
            });
        } catch (error) {
            console.error('Error loading real profiles:', error);
            res.status(500).json({
                error: 'Failed to load real profiles',
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