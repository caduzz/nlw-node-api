require('dotenv').config();
import express, { json } from 'express';
import cors from 'cors';

import axios from 'axios';

import { PrismaClient } from '@prisma/client'

import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';
import { getTokenDiscordCode, getUsersDiscord } from './services/auth';

const app = express();

app.use(express.json());
app.use(cors());

const prisma = new PrismaClient();


app.get('/games', async (req, res) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true
                }
            }
        }
    })
    return res.json(games);
});

app.post('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id;
    const { name, yearsPlaying, discord, weekDays, hourStart, hourEnd, useVoiceChannel } = req.body;

    try {
        const ad = await prisma.ad.create({
            data: {
                gameId,
                name: name,
                yearsPlaying: yearsPlaying,
                discord: discord,
                weekDays: weekDays.join(','),
                hourStart: convertHourStringToMinutes(hourStart),
                hourEnd: convertHourStringToMinutes(hourEnd),
                useVoiceChannel: useVoiceChannel,
            }
        })

        const userSelect = await prisma.user.findMany({
            where: { game_favorit_id: gameId },
            include: {
                game: {
                    select: {
                        title: true
                    }
                }
            }
        });

        userSelect.map(user => {
            axios.post('https://exp.host/--/api/v2/push/send', {
                to: user.tokem_notfication_mobile,
                title: `Novo Anucio Adcionado`,
                body: `Por ${name} - ${user.game.title}`
            });
        })
        
        return res.status(201).json(ad);
    } catch (error) {
        console.log(error)
        return res.status(504).json(error);
    }
});

app.get('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
        },
        where: { gameId },
        orderBy: { createAt: 'desc' }
    })

    return res.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd)
        }
    }));
});

app.get('/ads/:id/discord', async (req, res) => {
    const adId = req.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true
        },
        where: {
            id: adId
        }
    })
    
    return res.json(ad);
});

app.get('/auth/discord/redirect', async (req, res) => {
    const { code } = req.query;
    
    const routRedirect = 'http://127.0.0.1:5173/login';

    if(code) {
        try {
            const { access_token } = await getTokenDiscordCode(code.toString())

            res.redirect(`${routRedirect}?token=${access_token}`)
        } catch(err: any) {
            return res.send(err)
        }
    }else {
        return res.sendStatus(412)
    }
});

app.post('/auth/discord/user', async (req, res) => {
    const { access_token, game_id, token_mobile } = req.body;

    if(access_token) {
        try {
            const { id, avatar, email, username, discriminator, banner_color, verified } = await getUsersDiscord(access_token);

            const emailSelectVerify = await prisma.user.findMany({where: { email }});
            if (emailSelectVerify.length === 0) {                
                await prisma.user.create({
                    data: {
                        email: email,
                        game_favorit_id: game_id,
                        tokem_notfication_mobile: token_mobile || 'null',
                    }
                })
            }

            res.json({id, avatar, email, username, discriminator, banner_color, verified});
        } catch(err: any) {
            return res.json({error: true})
        }
    }
});

app.listen(3025);
