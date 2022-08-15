export class Timer {

    endTime: number = 0
    startTime: number = 0
    stopTime: number = 0

    start() {
        this.startTime = new Date().getTime()
    }

    end() {
        this.endTime = new Date().getTime()
        this.endTime = this.endTime - this.startTime
    }

    reset(){
        this.endTime = 0
        this.startTime = 0
        this.stopTime = 0
    }

    get getEndTime(): number {
        return this.endTime
    }

    get getEndTimeAsDate(): Date {
        return new Date(this.endTime)
    }

    get getEndTimeAsDateString(): string {
        const date = this.getEndTimeAsDate
        return date.toISOString()
    }

}