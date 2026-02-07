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

    // Post /api/matching/find - Find matching profiles
    async findMatches(req: Request, res: Response): Promise<void> {
        try {
            const { profileId, profileText, searcherType, topN, minSimilarity } = req.body;
            const useRealData = req.query.useRealData === 'true';

            console.log('🔍 Match request:', {
                hasProfileId: !!profileId,
                hasProfileText: !!profileText,
                searcherType,
                useRealData
            });

            // Validate input
            if (!profileId && !profileText) {
                res.status(400).json({
                    error: 'Either profileId or profileText must be provided'
                });
                return;
            }

            let matches: any[];

            if (useRealData) {
                // Real data mode - search database profiles
                if (!searcherType) {
                    res.status(400).json({
                        error: 'searcherType is required for real data search'
                    });
                    return;
                }

                // Determine target type (opposite of searcher)
                const targetType = searcherType === 'patient' ? 'donor' : 'patient';

                // Extract user ID from profileId if available
                let excludeUserId: number | undefined;
                if (profileId) {
                    const parts = profileId.split('-');
                    if (parts.length >= 3 && parts[2]) {
                        const userId = parseInt(parts[2]);
                        if (!isNaN(userId)) {
                            excludeUserId = userId;
                        }
                    }
                }

                // Use search criteria if provided, otherwise use profileId
                const searchCriteria = profileText || '';

                if (searchCriteria) {
                    // AI-powered search with criteria
                    const minScore = minSimilarity !== undefined ? minSimilarity * 100 : 50;
                    matches = await matchingService.searchRealProfiles(
                        searchCriteria,
                        targetType,
                        excludeUserId,
                        topN || 10,
                        minScore
                    );
                } else {
                    // Profile-to-profile matching
                    matchingService.clearAll();
                    await matchingService.loadRealUserProfiles(targetType, excludeUserId);

                    const matchRequest = { profileId, profileText, searcherType, topN, minSimilarity };
                    matches = await matchingService.findTopMatches(matchRequest);
                }
            } else {
                // Demo mode - use in-memory profiles
                const matchRequest = { profileId, profileText, searcherType, topN, minSimilarity };
                matches = await matchingService.findTopMatches(matchRequest);
            }

            res.json({
                success: true,
                matches,
                count: matches.length,
                mode: useRealData ? 'real' : 'demo',
                searchCriteria: profileText || 'profile-based'
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
            // Load all real profiles from database for Demo Mode
            const { ProfileService } = await import('../services/profile.service');

            // Get ALL profiles (both patients and donors, complete and incomplete)
            const allProfiles = ProfileService.getAllProfilesForDemo();

            // Convert to matching service format
            const profiles = allProfiles.map(data => ({
                id: data.id,
                name: data.name || 'Unknown',
                type: data.type,
                bloodType: data.blood_type || 'Not specified',
                age: data.age || 0,
                country: data.country || '',
                state: data.state || '',
                city: data.city || '',
                organType: data.organ_type || 'Not specified',
                description: data.description || 'No description provided',
                medicalInfo: data.medical_info || '',
                preferences: data.preferences || ''
            }));

            res.json({
                success: true,
                profiles: allProfiles,
                count: allProfiles.length,
                source: 'database-all',
                breakdown: {
                    patients: profiles.filter(p => p.type === 'patient').length,
                    donors: profiles.filter(p => p.type === 'donor').length,
                    complete: allProfiles.filter(p => p.is_complete).length,
                    incomplete: allProfiles.filter(p => !p.is_complete).length
                }
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