import ExcelJs, {CellValue} from 'exceljs'
import {input} from '@inquirer/prompts';
import path from "path";
// 定义一个类型来表示 row.values，它是一个从索引1开始的稀疏数组
type RowValues = [undefined, ...Array<CellValue | undefined>];

const wb = new ExcelJs.Workbook()
const ano = new ExcelJs.Workbook()
ano.addWorksheet("sheet")
let rowNum = 1
const file = await input({
    required: true,
    message: "输入文件名:"
})
wb.xlsx.readFile(file).then(() => {
    const sheet = wb.getWorksheet('Sheet1')
    sheet.eachRow((row: ExcelJs.Row, rowNumber: number) => {
        const values = row.values as RowValues;
        if (values.findIndex((item) => item !== undefined && typeof item === 'string' && item.indexOf("#Name") !== -1) !== -1) {
            return
        }
        if (values.length <= 1) {
            return;
        }
        const firstCell = values[1];
        if (firstCell === undefined) return;

        const name = firstCell.toString()
        for (let i = 2; i < values.length; i++) {
            const cell = values[i];
            if (cell !== undefined) {
                let val = cell.toString()
                if (val.indexOf("|") != -1) {
                    val = val.split("|")[1]
                    if (val.indexOf("(") != -1) {
                        val = val.split("(")[0]
                        console.log(name, val)
                        let row = ano.getWorksheet("sheet").getRow(rowNum)
                        row.getCell(1).value = name
                        row.getCell(2).value = val
                        row.commit()
                        rowNum++
                    }
                }
            }
        }
    })

    const output = path.join(path.dirname(file), `${path.basename(file, path.extname(file))}_cvt.xlsx`)

    ano.xlsx.writeFile(output).then(() => {
        console.log("ok")
    })
})