import axios from 'axios';
import url from 'url';
import { convertHourStringToMinutes } from '../../utils/convert-hour-string-to-minutes';

export interface ResponseTokensDiscordProps {
    data: {
        access_token: string,
        refresh_token: string,
    }
}
export interface UserDiscordProps {
    data: {
        id: string,
        avatar: string,
        email: string,
        username: string,
        discriminator: number,
        banner_color: string,
        verified: boolean
    }
}

export const getTokenDiscordCode = async (code: string) => {
    const formData: object = new url.URLSearchParams({
        client_id: `${process.env.DISCORD_CLIENTE_ID}`,
        client_secret: `${process.env.DISCORD_CLIENTE_SECRET}`,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:3025/auth/discord/redirect',
    })

    const { data: response } : ResponseTokensDiscordProps = await axios.post('https://discord.com/api/v10/oauth2/token', 
        formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    )

    return response;
}

export const getUsersDiscord = async (access_token: string) => {
    const {data}:UserDiscordProps = await axios.get(
        'https://discord.com/api/v8/users/@me', {
            headers: { 
                Authorization: `Bearer ${access_token}`
            }
        }
    );

    return data;
}