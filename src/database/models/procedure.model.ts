import { Schema, model, Types } from 'mongoose'

const ProcedureMaterialSchema = new Schema({
    materialId: { type: Types.ObjectId, ref: 'Material', required: true },
    qtyPerProcedure: { type: Number, required: true }
}, { _id: false })

const ProcedureSchema = new Schema({
    name: { type: String, required: true },
    durationMin: { type: Number, required: true },
    price: { type: Number, required: true },
    bom: { type: [ProcedureMaterialSchema], default: [] } // list of materials used
}, { timestamps: true })

export const Procedure = model('Procedure', ProcedureSchema)
