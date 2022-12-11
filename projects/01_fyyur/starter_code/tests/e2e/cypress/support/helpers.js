import dayjs from "dayjs";

export const getTimestamp = () => {
    const timestamp = dayjs().format('YYYY-MM-DD-HHmmss')
    return timestamp;
}