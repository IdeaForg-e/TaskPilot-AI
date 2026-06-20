# DEV 5 will implement this
class OrchestratorService:
    def __init__(self, db):
        self.db = db
    
    def run_pipeline(self, context):
        raise NotImplementedError("Dev 5 will implement")
    
    def get_pipeline_state(self, run_id):
        raise NotImplementedError("Dev 5 will implement")